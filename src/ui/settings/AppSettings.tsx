import {Flex} from "antd";
import {SettingSwitch} from "./SettingsControls.tsx";
import {alternateFilePicker} from "../../logic/Settings.ts";

export const AppSettings = () => (
    <Flex vertical gap="middle">
        <SettingSwitch setting={alternateFilePicker} title="Alternate File Picker" description="Use an alternate file picker for better compatability. Enable this if you have issues with the file picker." />
    </Flex>
)