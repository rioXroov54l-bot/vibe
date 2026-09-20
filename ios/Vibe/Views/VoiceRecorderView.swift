import SwiftUI
import AVFoundation

@MainActor
final class VoiceRecorderModel: NSObject, ObservableObject, AVAudioRecorderDelegate {
    @Published var isRecording = false
    @Published var recordingURL: URL?

    private var recorder: AVAudioRecorder?

    func startRecording() async {
        let granted = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        guard granted else { return }
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".m4a")
        recorder = try? AVAudioRecorder(url: url, settings: settings)
        recorder?.delegate = self
        recorder?.record()
        isRecording = true
    }

    func stopRecording() {
        recorder?.stop()
        isRecording = false
        recordingURL = recorder?.url
    }
}

struct VoiceRecorderView: View {
    @StateObject private var model = VoiceRecorderModel()

    var body: some View {
        VStack(spacing: 20) {
            Button {
                Task {
                    if model.isRecording {
                        model.stopRecording()
                    } else {
                        await model.startRecording()
                    }
                }
            } label: {
                Image(systemName: model.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                    .font(.system(size: 68))
                    .foregroundStyle(model.isRecording ? .red : .purple)
            }

            if let url = model.recordingURL {
                Text(url.lastPathComponent)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }
}
