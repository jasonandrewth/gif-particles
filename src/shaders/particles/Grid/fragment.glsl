uniform sampler2D uParticleTex;
uniform bool uShowPoint;

void main() {
    vec3 color = vec3(1.0, 1.0, 1.0);
    float alphaTexture = texture2D(uParticleTex, gl_PointCoord).r;

    float alpha = uShowPoint ? 1.0 : alphaTexture;

    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5 && uShowPoint)
        discard;

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}