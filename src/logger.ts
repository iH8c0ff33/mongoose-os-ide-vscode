export class Logger {
  private _indentLevel = 0
  private _tabSize = 2
  private _lineStart = false

  constructor(private _writer: (text: string) => void,
    private _prefix?: string) { }

  public indentMore(value: number = 1) {
    this._indentLevel += value
  }

  public indentLess(value: number = 1) {
    this._indentLevel =
      (this._indentLevel - value < 0) ? 0 :
        this._indentLevel - value
  }

  public append(text?: string) {
    this._append(text || "")
  }

  public appendLine(text?: string) {
    this._append(text + "\n")
    this._lineStart = true
  }

  private _append(text: string) {
    if (this._lineStart) {
      if (this._indentLevel > 0) {
        this._writer(" ".repeat(this._indentLevel * this._tabSize))
      }

      this._lineStart = false
    }

    this._writer(this._prefix ? `${this._prefix}: ${text}` : text)
  }
}
