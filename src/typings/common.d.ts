/** The common type namespace */
declare namespace CommonType {
  /** The strategic pattern */
  interface StrategicPattern {
    /** The condition */
    condition: boolean;
    /** If the condition is true, then call the action function */
    callback: () => void;
  }

  /**
   * The option type
   *
   * @property value: The option value
   * @property label: The option label
   */
  type Option<K = string, M = string> = { value: K; label: M };

  /** The id type */
  type IdType = string | number;

  /** The res error code */
  type ErrorCode = '401' | '403' | '404' | 'default';

  type YesOrNo = 'Y' | 'N';

  type EnableStatus = '0' | '1';

  /** add null to all properties */
  type RecordNullable<T> = {
    [K in keyof T]?: T[K] | null;
  };

  /** The configuration options for constructing tree structure data */
  type TreeConfig = {
    /** id field name */
    idField: string;
    /** parent id field name */
    parentIdField?: string;
    /** children field name */
    childrenField?: string;
    /** filter function */
    filterFn?: (node: any) => boolean;
  };
}
