import {BehaviorSubject, map, type Observable} from "rxjs";
import {sendCefQuery} from "../cef/cef.ts";
import {IS_DESKTOP_APP} from "../site.ts";
import {latestSkippedVersion} from "./Settings.ts";

export const LATEST_PROTOCOL_VERSION = 1;
export const LATEST_APP_VERSION = '1.0.2';

export type AppVersion = {
    app: string;
    protocol: number;
}

export type UpdateStatus = 'latest' | 'available' | 'required'

export const appVersion = new BehaviorSubject<AppVersion>({app: LATEST_APP_VERSION, protocol: LATEST_PROTOCOL_VERSION});
export const updateStatus: Observable<UpdateStatus> = appVersion.pipe(
    map(version => {
        if (version.protocol !== LATEST_PROTOCOL_VERSION) {
            return 'required';
        } else if (version.app !== LATEST_APP_VERSION) {
            return 'available';
        } else {
            return 'latest';
        }
    })
)

export const suppressUpdateNotification = latestSkippedVersion.observable.pipe(
    map(version => {
        return version === LATEST_APP_VERSION;
    })
)

async function getAppVersion() : Promise<AppVersion> {
    return JSON.parse(await sendCefQuery({
        action: 'version'
    }));
}

if (IS_DESKTOP_APP) {
    appVersion.next(await getAppVersion());
}
