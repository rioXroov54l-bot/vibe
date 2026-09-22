import XCTest

final class VibeUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Full journey: launch → sign in → onboarding → main app.
    func testFullUserJourney() throws {
        let app = XCUIApplication()
        app.launch()

        // 1. Welcome screen is the real Vibe auth experience.
        XCTAssertTrue(app.buttons["Create account"].waitForExistence(timeout: 15), "Welcome 'Create account' missing")
        XCTAssertTrue(app.buttons["Sign in"].exists, "Welcome 'Sign in' missing")
        attach(app.screenshot(), named: "01-welcome")

        // 2. Go to login.
        app.buttons["Sign in"].tap()
        let emailField = app.textFields["name@example.com"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 8), "Login email field missing")
        attach(app.screenshot(), named: "02-login")

        // 3. Enter credentials.
        let email = ProcessInfo.processInfo.environment["VIBE_TEST_EMAIL"] ?? "vibe.tester@vibeapp.dev"
        let password = ProcessInfo.processInfo.environment["VIBE_TEST_PASSWORD"] ?? "VibeTest123!"
        emailField.tap()
        emailField.typeText(email)
        let passwordField = app.secureTextFields.firstMatch
        passwordField.tap()
        passwordField.typeText(password)
        attach(app.screenshot(), named: "03-credentials")

        // 4. Submit login.
        app.buttons["Sign in"].tap()

        // 5. Onboarding (new confirmed user has no profile) or straight to main.
        if app.staticTexts["Let's talk lifestyle habits"].waitForExistence(timeout: 20) {
            attach(app.screenshot(), named: "04-lifestyle")
            // Step 1: Lifestyle habits.
            app.buttons["Not for me"].tap()
            app.buttons["Non-smoker"].tap()
            app.buttons["Sometimes"].tap()
            app.buttons["Dog"].tap()
            attach(app.screenshot(), named: "05-lifestyle-selected")
            app.buttons["Next"].tap()

            // Step 2: Personality & communication.
            XCTAssertTrue(app.staticTexts["What else makes you-you?"].waitForExistence(timeout: 8), "Personality step missing")
            app.buttons["Phone caller"].tap()
            app.buttons["Time together"].tap()
            app.buttons["Leo"].tap()
            attach(app.screenshot(), named: "06-personality")
            app.buttons["Next"].tap()

            // Step 3: Interests (3+ required).
            XCTAssertTrue(app.staticTexts["What are you into?"].waitForExistence(timeout: 8), "Interests step missing")
            app.buttons["Reading"].tap()
            app.buttons["Home Workout"].tap()
            app.buttons["Binge-Watching TV shows"].tap()
            attach(app.screenshot(), named: "07-interests")
            app.buttons["Next"].tap()
        }

        // 6. Main app reached.
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 20), "Main tab bar not reached")
        attach(app.screenshot(), named: "08-main")

        // 7. Verify tabs + navigate.
        XCTAssertTrue(app.tabBars.buttons["Discover"].exists, "Discover tab missing")
        app.tabBars.buttons["Discover"].tap()
        attach(app.screenshot(), named: "08-discover")

        // Rooms list.
        XCTAssertTrue(app.tabBars.buttons["Rooms"].exists, "Rooms tab missing")
        app.tabBars.buttons["Rooms"].tap()
        XCTAssertTrue(app.staticTexts["Late Night Talk"].waitForExistence(timeout: 10), "Rooms list missing")
        attach(app.screenshot(), named: "09-rooms")

        // Open a room chat.
        app.staticTexts["Late Night Talk"].tap()
        XCTAssertTrue(app.navigationBars["Late Night Talk"].waitForExistence(timeout: 10), "Room chat not opened")
        attach(app.screenshot(), named: "10-chat")

        // Profile.
        app.tabBars.buttons["Profile"].tap()
        attach(app.screenshot(), named: "10-profile-tab")
    }

    private func attach(_ screenshot: XCUIScreenshot, named name: String) {
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
