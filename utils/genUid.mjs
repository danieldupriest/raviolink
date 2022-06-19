export default (length) => {
    const alphabet =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let output = ""
    for (let i = 0; i < length; i++) {
        const randomInt = Math.floor(Math.random() * alphabet.length)
        const randomChar = alphabet.charAt(randomInt)
        output += randomChar
    }
    return output
}
