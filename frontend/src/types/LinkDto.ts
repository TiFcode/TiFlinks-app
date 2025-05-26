export type LinkType = 
  | 'HAS_SENSE'
  | 'HAS_ATTRIBUTE'
  | 'HAS_VALUE'
  | 'Semantic Reference';

export interface LinkDto {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  metadata?: {
    attributeName?: string;  // For attribute links: name of the attribute
  };
} 