attribute float aSpeedFactor; // New attribute

uniform vec2 uResolution;
uniform float uTime;
uniform float uSize;
uniform float uSpeed;
uniform float uProgress;
uniform bool uShowPoint;
#include ../../includes/simplexNoise4d.glsl

void main() {

    //New Position
    vec3 newpos = position;
    float timeFactor = (sin(uTime) + 1.0) * 0.5;

    // newpos.x += sin(uTime) * aSpeedFactor * 0.1;
    newpos.z -= (mod(uTime / 10.0, 1.0) + 0.03) * uSpeed;
    // newpos.z -= mod(uTime + position.z, 30.0) + newpos.z;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newpos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Point size
    float dist = distance(vec2(0.5), uv);
    dist += (sin(uTime) + 1.0) * 0.5;

    float sizeFactor = uShowPoint ? 0.003 : 0.008;

    gl_PointSize = uSize * sizeFactor * uResolution.y * aSpeedFactor;
    gl_PointSize *= (1.0 / -viewPosition.z);
}