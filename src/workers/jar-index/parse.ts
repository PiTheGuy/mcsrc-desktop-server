import type {ClassDataString, Field, MemberData, Method} from "./types.ts";
import {toClassName} from "../../utils/Names.ts";
import type {ClassData} from "./client.ts";

export function parseClassData(data: ClassDataString): ClassData {
    const [className, superName, accessFlagsStr, interfacesStr] = data.split("|");
    return {
        className: toClassName(className),
        superName: superName ? toClassName(superName) : "",
        accessFlags: parseInt(accessFlagsStr, 10),
        interfaces: interfacesStr ? interfacesStr.split(",").filter(i => i.length > 0).map(toClassName) : []
    };
}

export function parseMemberData(data: string): MemberData {
    const [className, methodsStr, fieldsStr] = data.split("|");
    return {
        className: toClassName(className),
        methods: methodsStr.split(',') as Method[],
        fields: fieldsStr.split(',') as Field[]
    }
}