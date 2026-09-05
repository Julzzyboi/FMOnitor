import 'package:flutter/material.dart';
import '../../../theme/app_colors.dart';

/// The equipment photo, or a plain placeholder box when none has been
/// added yet - a real gray square with an image icon, not a skeleton
/// shimmer, since this isn't "still loading", it's "no photo on file".
class EquipmentThumbnail extends StatelessWidget {
  const EquipmentThumbnail({super.key, required this.imageAsset, required this.borderRadius, this.iconSize = 22});

  final String? imageAsset;
  final double borderRadius;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        color: AppColors.surfaceMuted,
        child: imageAsset == null
            ? Center(
                child: Icon(Icons.image_outlined, size: iconSize, color: AppColors.textMuted.withValues(alpha: 0.6)),
              )
            : Image.asset(
                imageAsset!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Center(
                  child: Icon(Icons.image_outlined, size: iconSize, color: AppColors.textMuted.withValues(alpha: 0.6)),
                ),
              ),
      ),
    );
  }
}
