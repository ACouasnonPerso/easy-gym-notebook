import UIKit
import Capacitor

/// Root view controller (set in Main.storyboard). Registers the app's local plugins.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WatchConnectivityPlugin())
    }
}
