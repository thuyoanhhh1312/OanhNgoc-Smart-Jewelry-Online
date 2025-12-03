import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Html, OrbitControls, useBounds, useGLTF } from '@react-three/drei';

const Model = ({ url }) => {
  const { scene } = useGLTF(url);
  const bounds = useBounds();

  useEffect(() => {
    if (!scene) return;
    bounds.refresh(scene).fit();
  }, [bounds, scene]);

  return <primitive object={scene} />;
};

const ThreeDViewer = ({ modelPath }) => {
  useEffect(() => {
    if (modelPath) {
      useGLTF.preload(modelPath);
    }
  }, [modelPath]);

  if (!modelPath) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        Không tìm thấy mô hình 3D
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 45 }} className="bg-gray-50">
        <color attach="background" args={['#f8fafc']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />

        <Suspense
          fallback={
            <Html center className="text-sm text-gray-600">
              Đang tải mô hình 3D...
            </Html>
          }
        >
          <Bounds fit clip observe margin={1.2}>
            <Model url={modelPath} />
          </Bounds>
        </Suspense>

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
};

export default ThreeDViewer;
