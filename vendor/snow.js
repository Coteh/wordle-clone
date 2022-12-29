/* https://embed.im/snow */
/* with some modifications made for wordle-clone:
- Positions are re-randomized whenever window is resized. 
    This addresses an issue where opening and closing the Inspect pane (when docked the bottom)
    or switching the device orientation from portrait to landscape (or vice versa) causes the 
    snowfall to not readjust itself.
    Originally, I was going to just remove and re-add the base element to the DOM, but I found
    that when the page is refreshed in landscape mode and the orientation is switched back to portrait, 
    some snowflakes are locked in place and some snowflakes end up falling at a slow rate.
    By re-randomizing the positions as well, this issue is fixed as well.
*/
var embedimSnow = document.getElementById("embedim--snow");
if (!embedimSnow) {
    function embRand(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }
    const generateSnowflakeElements = () => {
        let snowHTML = "";
        let snowCSS = "";
        for (i = 1; i < 200; i++) {
            snowHTML += '<i class="embedim-snow"></i>';
            var rndX = embRand(0, 1000000) * 0.0001,
                rndO = embRand(-100000, 100000) * 0.0001,
                rndT = (embRand(3, 8) * 10).toFixed(2),
                rndS = (embRand(0, 10000) * 0.0001).toFixed(2);
            snowCSS +=
                ".embedim-snow:nth-child(" +
                i +
                "){" +
                "opacity:" +
                (embRand(1, 10000) * 0.0001).toFixed(2) +
                ";" +
                "transform:translate(" +
                rndX.toFixed(2) +
                "vw,-10px) scale(" +
                rndS +
                ");" +
                "animation:fall-" +
                i +
                " " +
                embRand(10, 30) +
                "s -" +
                embRand(0, 30) +
                "s linear infinite" +
                "}" +
                "@keyframes fall-" +
                i +
                "{" +
                rndT +
                "%{" +
                "transform:translate(" +
                (rndX + rndO).toFixed(2) +
                "vw," +
                rndT +
                "vh) scale(" +
                rndS +
                ")" +
                "}" +
                "to{" +
                "transform:translate(" +
                (rndX + rndO / 2).toFixed(2) +
                "vw, 105vh) scale(" +
                rndS +
                ")" +
                "}" +
                "}";
        }
        return {
            html: snowHTML,
            css: snowCSS,
        };
    }
    const setSnowElementInnerHTML = () => {
        embedimSnow.innerHTML =
            "<style>#embedim--snow{position:fixed;left:0;top:0;bottom:0;width:100vw;height:100vh;overflow:hidden;z-index:9999999;pointer-events:none}" +
            baseEmbCSS + snowElements.css +
            "</style>" +
            snowElements.html;
    };
    var baseEmbCSS =
        ".embedim-snow{position: absolute;width: 10px;height: 10px;background: white;border-radius: 50%;margin-top:-10px}";
    var snowElements = generateSnowflakeElements();

    embedimSnow = document.createElement("div");
    embedimSnow.id = "embedim--snow";
    setSnowElementInnerHTML();
    
    document.body.appendChild(embedimSnow);
    
    addEventListener("resize", (e) => {
        snowElements = generateSnowflakeElements();
        setSnowElementInnerHTML();
    })
}
