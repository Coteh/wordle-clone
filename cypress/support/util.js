// Replaces all instances of "\r\n" with "\n"
export function replaceCRLFWithLF(str) {
    return str.replace(/\r\n/g, "\n");
}
