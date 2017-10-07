export enum Platform {
  esp8266,
  esp32
}

export async function parsePlatform(platformString: string) {
  if (platformString.indexOf("esp8266") !== -1) {
    return Platform.esp8266
  } else if (platformString.indexOf("esp32") !== -1) {
    return Platform.esp32
  } else {
    throw new Error("Failed to parse platform")
  }
}
