export enum Platform {
  esp8266,
  esp32,
  none
}

export const Platforms = [Platform.esp8266, Platform.esp32]

/**
 * Get platform from its string representation
 * 
 * @export
 * @param {string} platformString 
 * @returns {Platform} platform
 */
export async function parsePlatform(platformString: string) {
  if (platformString.indexOf("esp8266") !== -1) {
    return Platform.esp8266
  } else if (platformString.indexOf("esp32") !== -1) {
    return Platform.esp32
  } else {
    return Platform.none
  }
}
