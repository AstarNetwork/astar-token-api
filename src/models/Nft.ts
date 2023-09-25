export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  contractAddress: string;
  tokenId: string;
  tokenUri: string;
  ownerAddress: string;
}

export interface NftResponse {
  items: NftMetadata[];
  total: number;
  page: number;
  size: number;
  pages: number;
}