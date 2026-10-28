import ProgressModal from "./ProgressModal";
import AboutModal from "./AboutModal";
import SettingsModal from "./settings/SettingsModal";
import StructureModal from "./StructureModal";
import { JarDecompilerModal, JarDecompilerProgressModal } from "./JarDecompilerModal";
import IndexProgressNotification from "./IndexProgressNotification";
import {IS_DESKTOP_APP} from "../site.ts";
import UpdateModal from "./UpdateModal.tsx";
import LauncherMetaModal from "./meta/LauncherMetaModal";

const Modals = () => {
    return (
        <>
            <IndexProgressNotification />
            <ProgressModal />
            <AboutModal />
            {IS_DESKTOP_APP && <UpdateModal />}
            <SettingsModal />
            <LauncherMetaModal />
            <StructureModal />
            <JarDecompilerModal />
            <JarDecompilerProgressModal />
        </>
    );
};

export default Modals;
