export type Category = 'defi' | 'gamefi' | 'infra' | 'nft' | 'others';

export interface DappItem {
    name: string;
    iconUrl: string;
    description: string;
    descriptionMarkdown?: string;
    url: string;
    address: string;
    license: string;
    videoUrl?: string;
    tags: string[];
    forumUrl: string;
    authorContact?: string;
    gitHubUrl: string;
    imagesUrl: string[];
    developers: Developer[];
    communities: Community[];
    contractType: string;
    mainCategory: Category;
}

export interface NewDappItem extends DappItem {
    iconFile: FileInfo;
    images: FileInfo[];
    senderAddress: string;
    signature: string;
}

export interface FileInfo {
    name: string;
    base64content: string;
    contentType: string;
}

export interface Developer {
    twitterAccountUrl: string;
    linkedInAccountUrl: string;
    githubAccountUrl: string;
    iconFile: string;
    name: string;
}

export enum CommunityType {
    Twitter = 'Twitter',
    Reddit = 'Reddit',
    Facebook = 'Facebook',
    TikTok = 'TikTok',
    YouTube = 'YouTube',
    Instagram = 'Instagram',
}

export interface Community {
    type: CommunityType;
    handle: string;
}
