import {useObservable} from "../utils/UseObservable.ts";
import {LATEST_APP_VERSION, suppressUpdateNotification, updateStatus} from "../cef/update.ts";
import {Button, Flex, Modal} from "antd";
import {sendCefQuery} from "../cef/cef.ts";
import {DownloadOutlined} from "@ant-design/icons";
import {BehaviorSubject, combineLatest, map} from "rxjs";
import {useState} from "react";
import {latestSkippedVersion} from "../logic/Settings.ts";

export const updateModalOpen = new BehaviorSubject<boolean>(true);
const showModal = combineLatest([updateStatus, suppressUpdateNotification, updateModalOpen]).pipe(
    map(([status, suppress, open]) => {
        console.log(status, suppress, open);
        return (status == 'required' || (status !== 'latest' && !suppress)) && open;
    })
);

export const UpdateModal = () => {
    const show = useObservable(showModal);
    console.log(latestSkippedVersion.value);
    const status = useObservable(updateStatus);


    useState(() => {
        if (show) {
            updateModalOpen.next(true);
        }
    });

    const required = status === 'required';

    function onCancel() {
        if (required) {
            return;
        }
        updateModalOpen.next(false);
    }
    return (
        <Modal
            title={required ? "Update Required" : "Update Available"}
            closable={!required}
            onCancel={onCancel}
            open={show}
            footer={null}
        >
            <p>{getMessage(required)}</p>
            <Flex gap={6}>
                <Update/>
                <SkipVersion/>
            </Flex>
        </Modal>
    )
}

function getMessage(required: boolean) {

    if (required) {
        return "A new version of mcsrc Desktop is required to continue working properly. Please update to continue using the app.";
    }
    return "A new version of mcsrc Desktop is available. Please update to enjoy the newest features and bug fixes.";
}

const SkipVersion = () => {
    const status = useObservable(updateStatus);
    if (status === 'required') {
        return <></>
    }

    async function onPress() {
        latestSkippedVersion.value = LATEST_APP_VERSION
        updateModalOpen.next(false);
    }
    return <Button
        type="default"
        onClick={onPress}
        aria-label="Skip Version"
    >
        Skip Version
    </Button>
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

export default UpdateModal;