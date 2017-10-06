export enum Platform {
  esp8266,
  esp32
}

export async function parsePlatform(platformString: string) {
  switch (platformString) {
    case "esp8266":
      return Platform.esp8266
    case "esp32":
      return Platform.esp32
    default:
      throw new Error("Failed to parse platform")
  }
}
