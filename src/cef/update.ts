import { BehaviorSubject } from "rxjs";
import {sendCefQuery} from "./cef.ts";
import {IS_DESKTOP_APP} from "../site.ts";

const LATEST_PROTOCOL_VERSION = 1;
const LATEST_APP_VERSION = '1.0.0';

export type UpdateStatus = 'latest' | 'available' | 'required'

export const updateStatus = new BehaviorSubject<UpdateStatus>('latest');

export async function checkForUpdate() : Promise<UpdateStatus> {
    let version = JSON.parse(await sendCefQuery({
        action: 'version'
    }));
    if (version.protocol !== LATEST_PROTOCOL_VERSION) {
        return 'required';
    } else if (version.app !== LATEST_APP_VERSION) {
        return 'available';
    } else {
        return 'latest';
    }
}

if (IS_DESKTOP_APP) {
    updateStatus.next(await checkForUpdate());
}
