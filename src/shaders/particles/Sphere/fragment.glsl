uniform sampler2D uParticleTex;

void main() {
    vec3 color = vec3(1.0, 1.0, 1.0);
    float alphaTexture = texture2D(uParticleTex, gl_PointCoord).r;

    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5)
        discard;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}