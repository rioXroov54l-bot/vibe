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
        let email = ProcessInfo.processInfo.environment["VIBE_TEST_EMAIL"] ?? "vibe.devtest@vibeapp.dev"
        let password = ProcessInfo.processInfo.environment["VIBE_TEST_PASSWORD"] ?? "VibeDevTest123!"
        emailField.tap()
        emailField.typeText(email)
        let passwordField = app.secureTextFields.firstMatch
        passwordField.tap()
        passwordField.typeText(password)
        attach(app.screenshot(), named: "03-credentials")

        // 4. Submit login.
        app.buttons["Sign in"].tap()

        // 5. Onboarding (new confirmed user has no profile) or straight to main.
        if app.buttons["Continue"].waitForExistence(timeout: 20) {
            attach(app.screenshot(), named: "04-onboarding-welcome")
            app.buttons["Continue"].tap()

            // Interest selection (circular cards).
            XCTAssertTrue(app.buttons["Music"].waitForExistence(timeout: 8), "Interest cards missing")
            app.buttons["Music"].tap()
            app.buttons["Travel"].tap()
            app.buttons["Technology"].tap()
            attach(app.screenshot(), named: "05-interests")
            app.buttons["Next"].tap()

            // Personality selection.
            XCTAssertTrue(app.buttons["Creative"].waitForExistence(timeout: 8), "Personality cards missing")
            app.buttons["Creative"].tap()
            app.buttons["Funny"].tap()
            attach(app.screenshot(), named: "06-personality")
            app.buttons["Next"].tap()

            // Profile completion.
            XCTAssertTrue(app.buttons["Enter Vibe"].waitForExistence(timeout: 8), "Profile step missing")
            attach(app.screenshot(), named: "07-profile")
            app.buttons["Enter Vibe"].tap()
        }

        // 6. Main app reached.
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 20), "Main tab bar not reached")
        attach(app.screenshot(), named: "08-main")

        // 7. Verify tabs + navigate.
        XCTAssertTrue(app.tabBars.buttons["Rooms"].exists, "Rooms tab missing")
        app.tabBars.buttons["Rooms"].tap()
        attach(app.screenshot(), named: "09-rooms")
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
