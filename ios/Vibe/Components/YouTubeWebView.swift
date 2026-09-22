import SwiftUI
import WebKit

/// Embeds a YouTube video in a WKWebView for inline playback.
struct YouTubeWebView: UIViewRepresentable {
    let videoID: String

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let html = """
        <!doctype html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"></head>
        <body style="margin:0;background:#000">
        <iframe width="100%" height="100%"
          src="https://www.youtube.com/embed/\(videoID)?autoplay=1&playsinline=1"
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}
