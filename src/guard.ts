export class Guard {
  /**
   * Throws Error if parameter value is not defined.
   * @param paramName Parameter name.
   * @param paramValue Parameter value.
   */
  // eslint-disable-next-line
  public static ThrowIfUndefined(paramName: string, paramValue: any): void {
    if (!paramName) {
      throw new Error('Invalid argument paramName');
    }

    if (!paramValue) {
      throw new Error(`Invalid argument ${paramName}`);
    }
  }
}
