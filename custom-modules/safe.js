const CryptoJS = require("crypto-js");

class Safe {

    constructor(password) {
        this.password = password;
    }

    encryptAsync(data) {
        return new Promise((resolve, reject) => {
            let ciphertext;
            try {
                ciphertext = CryptoJS.AES.encrypt(data, this.password).toString();
            } catch (exception) {
                reject({ message: exception.message });
            }
            resolve(ciphertext);
        });
    }

    decryptAsync(ciphertext) {
        return new Promise((resolve, reject) => {
            let originalText;
            try {
                const bytes = CryptoJS.AES.decrypt(ciphertext, this.password);
                originalText = bytes.toString(CryptoJS.enc.Utf8);
            } catch (exception) {
                reject({ message: exception.message });
            }
            resolve(originalText);
        });
    }

}

exports.Safe = Safe;