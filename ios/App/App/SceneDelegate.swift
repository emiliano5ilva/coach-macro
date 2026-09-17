import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Force dark mode — UI is designed exclusively for dark backgrounds.
        // Belt-and-suspenders alongside UIUserInterfaceStyle=Dark in Info.plist.
        // (Previously set on AppDelegate.window; moved here for scene lifecycle adoption.)
        window?.overrideUserInterfaceStyle = .dark
    }
}
