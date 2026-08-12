import {useObservable} from "../utils/UseObservable.ts";
import { updateStatus } from "../cef/update.ts";
import {Button, Modal} from "antd";
import {sendCefQuery} from "../cef/cef.ts";
import {DownloadOutlined} from "@ant-design/icons";

export const UpdateRequiredModal = () => {
    let status = useObservable(updateStatus);
    let modalOpen = status === 'required';
    return (
        <Modal
            title="Update Required"
            closable={false}
            open={modalOpen}
            footer={null}
        >
            <p>A new version of mcsrc Desktop is required. Please update to enjoy the newest features and bug fixes.</p>
            <Update />
        </Modal>
    )
}

const Update = () => {
    async function update() {
        await sendCefQuery({
            action: 'update'
        })
    }

    return <Button
        type="default"
        icon={<DownloadOutlined />}
        onClick={update}
        aria-label="Update"
    >
        Update
    </Button>
}

export default UpdateRequiredModal;