attribute float aSpeedFactor; // New attribute

uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
#include ../../includes/simplexNoise4d.glsl

vec3 getMobiusPoint(float u, float v) {
    float x = (2.0 + v * cos(u / 2.0)) * cos(u);
    float y = (2.0 + v * cos(u / 2.0)) * sin(u);
    float z = 4.0 * v * sin(u / 2.0);
    return vec3(x * 0.06, y * 0.06, z * 0.06);
}

void main() {

    float offset = aSpeedFactor;

    //New Position
    vec3 newpos = position;
    float timeFactor = (sin(uTime) + 1.0) * 0.5;

    float noise = snoise(vec4(position, uTime * 0.2));
    newpos.x += offset * noise * 0.01;

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