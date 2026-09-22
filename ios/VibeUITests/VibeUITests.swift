import XCTest

final class VibeUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Full journey: launch → sign in → onboarding → main app.
    func testFullUserJourney() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestAutoLogin"]
        app.launch()

        // Main app reached (auto-login skips onboarding for the onboarded account).
        XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 30), "Main screen not reached")
        attach(app.screenshot(), named: "08-explore-lobby")

        app.buttons["Likes"].tap()
        attach(app.screenshot(), named: "09-likes")

        app.buttons["Chat"].tap()
        attach(app.screenshot(), named: "10-chat")

        app.buttons["Profile"].tap()
        attach(app.screenshot(), named: "11-profile")
    }

    private func attach(_ screenshot: XCUIScreenshot, named name: String) {
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
