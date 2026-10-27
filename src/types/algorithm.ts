export type AlgorithmFamily = 'sorting' | 'searching' | 'divide_and_conquer' | 'custom';
export type SupportedLanguage = 'pseudocode' | 'python' | 'cpp' | 'java';

export interface CodeLine {
  lineNumber: number;
  code: string;
  indent: number;
}

export interface AlgorithmMetadata {
  id: string;
  name: string;
  family: AlgorithmFamily;
  categoryName: string;
  description: string;
  codeByLanguage: Record<SupportedLanguage, CodeLine[]>;
  defaultDataset: number[];
  complexity: {
    time: string;
    space: string;
    bestCase?: string;
    worstCase?: string;
    averageCase?: string;
  };
}
