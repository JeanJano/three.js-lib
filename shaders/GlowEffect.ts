import * as THREE from 'three';

/**
 * Material custom qui ajoute un effet glow au MeshStandardMaterial
 * Version 2 : Utilise les variables existantes de Three.js
 */
class GlowMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters?: THREE.MeshStandardMaterialParameters, glowOptions?: {
    glowColor?: THREE.Color;
    glowIntensity?: number;
    glowPower?: number;
  }) {
    super(parameters);
    
    const {
      glowColor = new THREE.Color(0x00ffff),
      glowIntensity = 2.0,
      glowPower = 3.0
    } = glowOptions || {};

    // Activer la transparence et le blending pour le glow
    this.transparent = true;
    this.blending = THREE.AdditiveBlending;
    this.side = THREE.FrontSide;
    this.depthWrite = true;

    // Marquer pour mise à jour
    this.needsUpdate = true;

    // Injection du code glow dans les shaders de MeshStandardMaterial
    this.onBeforeCompile = (shader) => {
      // Ajouter les uniforms custom
      shader.uniforms.uGlowColor = { value: glowColor };
      shader.uniforms.uGlowIntensity = { value: glowIntensity };
      shader.uniforms.uGlowPower = { value: glowPower };

      // Modifier le vertex shader - Scale les vertices
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Scale légèrement les vertices pour le glow
        transformed *= 1.1;
        `
      );

      // Modifier le fragment shader - Ajouter les uniforms en haut
      shader.fragmentShader = `
        uniform vec3 uGlowColor;
        uniform float uGlowIntensity;
        uniform float uGlowPower;
        ${shader.fragmentShader}
      `;

      // Ajouter l'effet glow à la fin du fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // --- Effet Glow avancé ---
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - max(0.0, abs(dot(viewDir, normalize(vNormal))));

        // Adoucissement du glow avec falloff exponentiel
        float glow = pow(rim, uGlowPower) * uGlowIntensity;

        // Atténuation progressive (simulateur de halo)
        glow *= smoothstep(0.0, 1.0, rim);
        glow *= exp(-3.0 * (1.0 - rim)); // plus doux vers l'intérieur

        // Couleur et intensité
        vec3 glowEffect = uGlowColor * glow;

        // --- Mélange doux ---
        gl_FragColor.rgb += glowEffect;
        gl_FragColor.a = max(gl_FragColor.a, rim * 0.5);
        `
      );

      // Stocker les uniforms pour pouvoir les modifier plus tard
      (this as any).customUniforms = shader.uniforms;
    };
  }

  // Méthodes pour modifier les paramètres du glow
  setGlowColor(color: THREE.Color) {
    if ((this as any).customUniforms) {
      (this as any).customUniforms.uGlowColor.value = color;
    }
  }

  setGlowIntensity(intensity: number) {
    if ((this as any).customUniforms) {
      (this as any).customUniforms.uGlowIntensity.value = intensity;
    }
  }

  setGlowPower(power: number) {
    if ((this as any).customUniforms) {
      (this as any).customUniforms.uGlowPower.value = power;
    }
  }
}

/**
 * Classe pour gérer l'effet glow sur un mesh animé
 */
export class GlowEffect {
  private originalMesh: THREE.Object3D;
  private glowMesh: THREE.Object3D;
  private glowMaterials: GlowMaterial[] = [];
  private originalToGlowMap: Map<THREE.Object3D, THREE.Object3D> = new Map();

  constructor(
    mesh: THREE.Object3D,
    options: {
      glowColor?: THREE.Color;
      glowIntensity?: number;
      glowPower?: number;
      scale?: number;
    } = {}
  ) {
    this.originalMesh = mesh;

    const {
      glowColor = new THREE.Color(0x00ffff),
      glowIntensity = 2.0,
      glowPower = 3.0,
      scale = 1.1
    } = options;

    // Clone profond du mesh
    this.glowMesh = mesh.clone();
    
    // Scale légèrement la copie
    this.glowMesh.scale.multiplyScalar(scale);

    // IMPORTANT: Forcer le partage des skeletons pour les animations
    const skinnedMeshes: Array<{ original: THREE.SkinnedMesh; glow: THREE.SkinnedMesh }> = [];
    
    this.originalMesh.traverse((originalChild) => {
      if (originalChild instanceof THREE.SkinnedMesh) {
        this.glowMesh.traverse((glowChild) => {
          if (glowChild instanceof THREE.SkinnedMesh && 
              glowChild.name === originalChild.name &&
              glowChild.uuid !== originalChild.uuid) {
            skinnedMeshes.push({ original: originalChild, glow: glowChild });
          }
        });
      }
    });

    // Rebinder tous les SkinnedMesh avec le skeleton original
    skinnedMeshes.forEach(({ original, glow }) => {
      glow.bind(original.skeleton, original.bindMatrix);
      glow.skeleton = original.skeleton;
      glow.bindMatrix.copy(original.bindMatrix);
      glow.bindMatrixInverse.copy(original.bindMatrixInverse);
    });

    // Construire la map de correspondance et remplacer les matériaux
    this.originalMesh.traverse((originalChild) => {
      this.glowMesh.traverse((glowChild) => {
        if (originalChild.name === glowChild.name && 
            originalChild.uuid !== glowChild.uuid) {
          this.originalToGlowMap.set(originalChild, glowChild);

          // Si c'est un mesh, remplacer le matériau
          if (glowChild instanceof THREE.Mesh) {
            const originalMaterial = originalChild instanceof THREE.Mesh ? 
              originalChild.material : null;
            
            // Créer un nouveau material glow basé sur l'original si possible
            let materialParams: THREE.MeshStandardMaterialParameters = {};
            
            if (originalMaterial instanceof THREE.MeshStandardMaterial) {
              // Copier certains paramètres du matériau original
              materialParams = {
                color: originalMaterial.color,
                roughness: originalMaterial.roughness,
                metalness: originalMaterial.metalness,
              };
            }

            const glowMaterial = new GlowMaterial(materialParams, {
              glowColor,
              glowIntensity,
              glowPower
            });

            glowChild.material = glowMaterial;
            this.glowMaterials.push(glowMaterial);

            // Partager le skeleton si c'est un SkinnedMesh
            if (glowChild instanceof THREE.SkinnedMesh && 
                originalChild instanceof THREE.SkinnedMesh) {
              // Important: partager le même skeleton pour que l'animation soit synchronisée
              glowChild.bind(originalChild.skeleton, originalChild.bindMatrix);
            }
          }
        }
      });
    });

    // Copier la position et rotation
    this.glowMesh.position.copy(mesh.position);
    this.glowMesh.rotation.copy(mesh.rotation);
    this.glowMesh.quaternion.copy(mesh.quaternion);
  }

  /**
   * Met à jour l'effet glow (à appeler dans le loop d'animation)
   */
  update(camera: THREE.Camera, deltaTime?: number) {
    // Synchroniser la position/rotation avec l'original
    this.glowMesh.position.copy(this.originalMesh.position);
    this.glowMesh.rotation.copy(this.originalMesh.rotation);
    this.glowMesh.quaternion.copy(this.originalMesh.quaternion);
    this.glowMesh.scale.copy(this.originalMesh.scale).multiplyScalar(1.1);

    // Synchroniser tous les enfants (important pour les animations complexes)
    this.originalToGlowMap.forEach((glowChild, originalChild) => {
      if (originalChild.parent && glowChild.parent) {
        glowChild.position.copy(originalChild.position);
        glowChild.rotation.copy(originalChild.rotation);
        glowChild.quaternion.copy(originalChild.quaternion);
        glowChild.scale.copy(originalChild.scale);
      }
    });

    this.glowMesh.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.skeleton) {
            child.skeleton.pose();
        }
    });
  }

  /**
   * Ajoute le mesh glow à la scène
   */
  addToScene(scene: THREE.Scene) {
    scene.add(this.glowMesh);
  }

  /**
   * Retire le mesh glow de la scène
   */
  removeFromScene(scene: THREE.Scene) {
    scene.remove(this.glowMesh);
  }

  /**
   * Change la couleur du glow
   */
  setGlowColor(color: THREE.Color) {
    this.glowMaterials.forEach(material => {
      material.setGlowColor(color);
    });
  }

  /**
   * Change l'intensité du glow
   */
  setGlowIntensity(intensity: number) {
    this.glowMaterials.forEach(material => {
      material.setGlowIntensity(intensity);
    });
  }

  /**
   * Change la puissance du glow (largeur)
   */
  setGlowPower(power: number) {
    this.glowMaterials.forEach(material => {
      material.setGlowPower(power);
    });
  }

  /**
   * Récupère le mesh glow
   */
  getGlowMesh(): THREE.Object3D {
    return this.glowMesh;
  }

  /**
   * Nettoie les ressources
   */
  dispose() {
    this.glowMaterials.forEach(material => material.dispose());
    this.glowMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}