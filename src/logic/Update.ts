import {BehaviorSubject, firstValueFrom, map, type Observable} from "rxjs";
import {sendCefQuery} from "../cef/cef.ts";
import {IS_DESKTOP_APP} from "../site.ts";
import {latestSkippedVersion} from "./Settings.ts";

export const LATEST_PROTOCOL_VERSION = 2;
export const LATEST_APP_VERSION = '1.3.1';

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
        type: 'version'
    }));
}

export function clientIsAtLeastVersion(version: string) {
    return appVersion.pipe(
        map(appVersion => {
            const [reqMajor, reqMinor, reqPatch] = version.split('.').map(Number);
            const [curMajor, curMinor, curPatch] = appVersion.app.split('.').map(Number);
            if (curMajor !== reqMajor) return curMajor > reqMajor;
            if (curMinor !== reqMinor) return curMinor > reqMinor;
            return curPatch >= reqPatch;
        })
    );
}

if (IS_DESKTOP_APP) {
    appVersion.next(await getAppVersion());
}
