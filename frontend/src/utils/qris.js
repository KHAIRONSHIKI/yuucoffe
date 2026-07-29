/**
 * Helper to generate a valid-looking Dynamic QRIS string with a specific nominal amount.
 */
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export const generateDynamicQris = (amount) => {
  const amountStr = amount.toString();
  const amountLength = amountStr.length.toString().padStart(2, '0');
  const amountTag = `54${amountLength}${amountStr}`;
  
  const part1 = "00020101021226570011ID.CO.QRIS.WWW011893600914000000000002091234567890303UMI51440014ID.CO.QRIS.WWW0215ID10265315500480303UMI520458125303360";
  const part2 = "5802ID5908YUUCOFFE6007JAKARTA61051234562140110YUUCOFFE01";
  
  const payloadBeforeCrc = part1 + amountTag + part2 + "6304";
  const crc = crc16(payloadBeforeCrc);
  return payloadBeforeCrc + crc;
};
