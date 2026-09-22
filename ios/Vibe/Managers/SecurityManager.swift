import Foundation
import CommonCrypto
import UIKit

/// Runtime security checks: jailbreak detection, debugger detection, and
/// SSL certificate pinning against the Supabase server public key.
enum SecurityManager {
    /// SHA-256 hash of the Supabase leaf certificate (DER) for pinning.
    static let pinnedCertificateHash = "be17bf3361a7691bdde293d92303ca3598e6c0d1426f8fb92e438a19daf8e31b"

    // MARK: Jailbreak detection

    static var isJailbroken: Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let jailbreakFiles = [
            "/Applications/Cydia.app",
            "/Applications/Sileo.app",
            "/Applications/Zebra.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/usr/bin/ssh",
            "/private/var/lib/apt",
            "/bin/bash"
        ]
        for path in jailbreakFiles where FileManager.default.fileExists(atPath: path) {
            return true
        }
        // Attempt to write outside the app sandbox.
        let testPath = "/private/jailbreak-" + UUID().uuidString + ".txt"
        do {
            try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
            try? FileManager.default.removeItem(atPath: testPath)
            return true
        } catch {
            return false
        }
        #endif
    }

    // MARK: Debugger detection

    static var isDebuggerAttached: Bool {
        var info = kinfo_proc()
        var size = MemoryLayout<kinfo_proc>.stride
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        guard sysctl(&mib, 4, &info, &size, nil, 0) == 0 else { return false }
        return (info.kp_proc.p_flag & P_TRACED) != 0
    }
}

/// URLSession delegate that pins the server's public key to prevent
/// man-in-the-middle attacks.
final class PinnedURLSessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        if let credential = Self.validate(serverTrust: serverTrust) {
            completionHandler(.useCredential, credential)
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }

    static func validate(serverTrust: SecTrust) -> URLCredential? {
        // Basic trust evaluation first.
        var error: CFError?
        guard SecTrustEvaluateWithError(serverTrust, &error) else { return nil }

        // Pin the leaf certificate's DER hash.
        guard let serverCertificates = SecTrustCopyCertificateChain(serverTrust) as? [SecCertificate],
              let leafCertificate = serverCertificates.first,
              let certificateData = SecCertificateCopyData(leafCertificate) as Data? else {
            return nil
        }
        let hash = sha256Hex(data: certificateData)
        guard hash == SecurityManager.pinnedCertificateHash else { return nil }
        return URLCredential(trust: serverTrust)
    }

    private static func sha256Hex(data: Data) -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { buffer in
            _ = CC_SHA256(buffer.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
