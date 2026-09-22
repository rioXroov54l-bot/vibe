import XCTest

final class VibeUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Full journey: launch → sign in → onboarding → main app.
    func testFullUserJourney() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestAutoLogin", "-UITestEnglish"]
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

    /// Tap through the main app and verify key buttons respond.
    func testMainAppButtons() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestAutoLogin", "-UITestEnglish"]
        app.launch()

        XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 30), "Explore not reached")

        // 1. Explore: quick hub navigation (Cinema -> back).
        app.buttons["🎬, Vibe Cinema"].tap()
        XCTAssertTrue(app.staticTexts["Paste YouTube or video link here..."].waitForExistence(timeout: 8), "Cinema not opened")
        app.navigationBars.buttons.firstMatch.tap()

        // 2. Explore: open create-room sheet via +.
        XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 8), "Explore not returned")
        app.buttons["Add"].tap()
        XCTAssertTrue(app.staticTexts["Create a room"].waitForExistence(timeout: 8), "Create room sheet not opened")
        app.buttons["Cancel"].tap()

        // 3. Explore: join a room via "Join the vibe".
        let join = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Join the vibe'")).firstMatch
        if join.waitForExistence(timeout: 8) {
            join.tap()
            XCTAssertTrue(app.staticTexts["Listen anonymously"].waitForExistence(timeout: 8), "Pre-join sheet not opened")
            app.buttons["Start listening anonymously"].tap()
            // Room controls.
            XCTAssertTrue(app.buttons["hand.raised"].waitForExistence(timeout: 8), "Raise hand missing")
            app.buttons["hand.raised"].tap()
            app.buttons["gift.fill"].tap()
            app.buttons["mic.fill"].tap()
            app.buttons["bubble.left.fill"].tap()
            XCTAssertTrue(app.staticTexts["Room chat"].waitForExistence(timeout: 8), "Chat drawer not opened")
        }

        // 4. Tabs.
        XCTAssertTrue(app.buttons["Likes"].exists, "Likes tab missing")
        XCTAssertTrue(app.buttons["Chat"].exists, "Chat tab missing")
        XCTAssertTrue(app.buttons["Profile"].exists, "Profile tab missing")

        // 5. Profile: sign out returns to welcome.
        app.buttons["Profile"].tap()
        let signOut = app.buttons["Sign out"]
        if signOut.waitForExistence(timeout: 8) {
            signOut.tap()
            XCTAssertTrue(app.buttons["Create account"].waitForExistence(timeout: 15), "Did not return to welcome after sign out")
        }
    }

    private func attach(_ screenshot: XCUIScreenshot, named name: String) {
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    /// Verify a newly created room appears in the lobby feed.
    func testCreateRoomAppears() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestAutoLogin", "-UITestEnglish"]
        app.launch()

        XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 30), "Explore not reached")

        // Open the create-room sheet.
        app.buttons["Add"].tap()
        XCTAssertTrue(app.textFields["e.g. Late night talk"].waitForExistence(timeout: 8), "Create sheet not opened")
        app.textFields["e.g. Late night talk"].tap()
        app.textFields["e.g. Late night talk"].typeText("My Test Room")

        // Submit.
        app.buttons["Create a room"].tap()

        // The new room should appear in the feed.
        XCTAssertTrue(app.staticTexts["My Test Room"].waitForExistence(timeout: 12), "Created room did not appear in feed")
        attach(app.screenshot(), named: "created-room")
    }
}
