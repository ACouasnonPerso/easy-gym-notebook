import Foundation
import Capacitor

/// Bridge between the web app and the Apple Watch.
/// JS side: src/app/secondary_ports/watch/watch.gateway.ts
@objc(WatchConnectivityPlugin)
public class WatchConnectivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WatchConnectivityPlugin"
    public let jsName = "WatchConnectivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pushSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingActions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledgeActions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearErrors", returnType: CAPPluginReturnPromise)
    ]

    private var observer: NSObjectProtocol?
    private var statusObserver: NSObjectProtocol?

    override public func load() {
        observer = NotificationCenter.default.addObserver(
            forName: WatchSessionManager.actionsAvailableNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.notifyListeners("actionsAvailable", data: [:], retainUntilConsumed: true)
        }
        statusObserver = NotificationCenter.default.addObserver(
            forName: WatchSessionManager.statusChangedNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.notifyListeners("statusChanged", data: [:])
        }
    }

    deinit {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
        }
        if let statusObserver = statusObserver {
            NotificationCenter.default.removeObserver(statusObserver)
        }
    }

    @objc func pushSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("Missing json")
            return
        }
        WatchSessionManager.shared.pushSnapshot(json: json)
        call.resolve()
    }

    @objc func getPendingActions(_ call: CAPPluginCall) {
        call.resolve(["actions": WatchSessionManager.shared.pendingActions()])
    }

    @objc func acknowledgeActions(_ call: CAPPluginCall) {
        let ids = (call.getArray("ids") ?? []).compactMap { $0 as? String }
        WatchSessionManager.shared.acknowledgeActions(ids: ids)
        call.resolve()
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve(WatchSessionManager.shared.status())
    }

    @objc func clearErrors(_ call: CAPPluginCall) {
        WatchSessionManager.shared.clearErrors()
        call.resolve()
    }
}
