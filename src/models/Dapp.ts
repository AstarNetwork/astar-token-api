export interface DappItem {
    name: string;
    iconUrl: string;
    description: string;
    descriptionMarkdown?: string;
    url?: string;
    address: string;
    license?: string;
    videoUrl?: string;
    tags?: string[];
    forumUrl?: string;
    authorContact?: string;
    gitHubUrl?: string;
    imagesUrl?: string[];
}

export interface NewDappItem extends DappItem {
    iconFileName: string;
    iconFile: string;
    images: File[];
    imagesContent: string[];
    videoUrlInput: string;
    senderAddress: string;
    signature: string;
}
