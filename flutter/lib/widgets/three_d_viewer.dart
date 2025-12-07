import 'package:flutter/material.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';

class ThreeDViewer extends StatelessWidget {
  final String modelAssetPath;

  const ThreeDViewer({super.key, required this.modelAssetPath});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ModelViewer(
        src: modelAssetPath,
        alt: 'Mô hình 3D sản phẩm',
        ar: false,
        autoRotate: true,
        cameraControls: true,
        backgroundColor: Colors.white,
      ),
    );
  }
}
