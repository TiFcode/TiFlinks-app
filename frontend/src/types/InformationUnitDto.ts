export interface InformationUnitDto {
  id: string;
  type: 'PILL' | 'SENSE' | 'ATTRIBUTE' | 'VALUE';
  content: string;
  attributes?: { [key: string]: string };  // For pills: stores selected attribute values
  metadata?: {
    pageId?: number;      // For senses: Wikipedia page ID
    snippet?: string;     // For senses: Wikipedia snippet
    parentId?: string;    // For attributes/values: reference to parent pill
  };
} 