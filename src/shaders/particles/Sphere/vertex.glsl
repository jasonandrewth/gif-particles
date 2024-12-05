attribute float aSpeedFactor; // New attribute
attribute float aSizeFactor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSize;
uniform float uProgress;
#include ../../includes/simplexNoise4d.glsl

void main() {

    float angle = uTime * (aSpeedFactor * -1.0) * 0.05; // Adjust speed with a multiplier

    angle = 2.0 * 3.14159265359 * uProgress * aSpeedFactor;

    // Rotation matrix for rotating around x-axis
    mat3 rotationX = mat3(1.0, 0.0, 0.0, 0.0, cos(angle), -sin(angle), 0.0, sin(angle), cos(angle));

    //New Position
    vec3 newpos = position;
    float timeFactor = (sin(uTime) + 1.0) * 0.5;
    newpos = rotationX * position;
    // newpos.x += sin(uTime) * aSpeedFactor * 0.1;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newpos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Point size
    float dist = distance(vec2(0.5), uv);
    dist += (sin(uTime) + 1.0) * 0.5;

    gl_PointSize = uSize * 0.005 * uResolution.y * aSizeFactor;
    gl_PointSize *= (1.0 / -viewPosition.z);
}