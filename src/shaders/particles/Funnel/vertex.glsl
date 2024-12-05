attribute float aOffset; // New attribute

uniform vec2 uResolution;
uniform float uTime;
uniform float uTunnelLength;

#include ../../includes/simplexNoise4d.glsl

void main() {

    //New Position
    vec3 newpos = position;
    float timeFactor = (sin(uTime * 0.2) + 1.0) * 0.5;

    // Animate particles along the z-axis
    newpos.z -= mod(uTime * 0.4 + aOffset * uTunnelLength, uTunnelLength);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newpos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Point size
    float dist = distance(vec2(0.5), uv);
    dist += (sin(uTime) + 1.0) * 0.5;

    gl_PointSize = 0.02 * uResolution.y;
    gl_PointSize *= (1.0 / -viewPosition.z);
}