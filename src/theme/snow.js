class SnowTheme {
    constructor() {
        this.snowEmbed = document.getElementById("embedim--snow");
        if (this.snowEmbed) {
            this.snowEmbed.style.display = "none";
        }
    }

    apply() {
        if (this.snowEmbed) {
            this.snowEmbed.style.display = "initial";
        }
    }

    teardown() {
        if (this.snowEmbed) {
            this.snowEmbed.style.display = "none";
        }
    }
}
