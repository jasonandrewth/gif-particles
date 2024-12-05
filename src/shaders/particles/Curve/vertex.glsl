uniform vec2 uResolution;
uniform float uTime;

#include ../../includes/simplexNoise4d.glsl

void main() {

    //New Position
    vec3 newpos = position;
    float timeFactor = (sin(uTime) + 1.0) * 0.5;
    // newpos.z += snoise(vec4(position, uTime));
    // newpos.y += mod(timeFactor, 3.0);
    newpos.y -= mod(uTime / 30.0, 3.0);

    float progress = smoothstep(-1.5, 4.0, newpos.y);
    newpos.z = progress * -newpos.y * newpos.y * newpos.y;
    // Final position
    vec4 modelPosition = modelMatrix * vec4(newpos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Point size
    float dist = distance(vec2(0.5), uv);
    dist += (sin(uTime) + 1.0) * 0.5;

    gl_PointSize = 0.01 * uResolution.y;
    gl_PointSize *= (1.0 / -viewPosition.z);
}