import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/skeleton_loader.dart';

/// The shape of the active-haul summary: route, a couple of quick stats,
/// and a details button - no text of its own, just the layout.
class ActiveHaulCard extends StatelessWidget {
  const ActiveHaulCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.yellow,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: FaIcon(FontAwesomeIcons.truckFast, size: 20, color: AppColors.waveBlack),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 130, height: 15, borderRadius: 4),
                    SizedBox(height: 6),
                    SkeletonBox(width: 170, height: 12, borderRadius: 4),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _RouteColumn(),
          const SizedBox(height: 16),
          const Row(
            children: [
              _MiniStat(icon: FontAwesomeIcons.boxOpen),
              _MiniStat(icon: FontAwesomeIcons.clock),
              _MiniStat(icon: FontAwesomeIcons.flag),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            height: 46,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.yellow,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.chevron_right, size: 20, color: AppColors.waveBlack),
          ),
        ],
      ),
    );
  }
}

class _RouteColumn extends StatelessWidget {
  const _RouteColumn();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _RoutePoint(),
        Padding(
          padding: EdgeInsets.only(left: 6),
          child: SizedBox(width: 1, height: 16, child: ColoredBox(color: AppColors.borderGray)),
        ),
        _RoutePoint(),
      ],
    );
  }
}

class _RoutePoint extends StatelessWidget {
  const _RoutePoint();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 3),
          child: FaIcon(FontAwesomeIcons.locationDot, size: 13, color: AppColors.yellow),
        ),
        const SizedBox(width: 8),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonBox(width: double.infinity, height: 12, borderRadius: 4),
              SizedBox(height: 5),
              SkeletonBox(width: 90, height: 10, borderRadius: 4),
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.icon});

  final FaIconData icon;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          FaIcon(icon, size: 13, color: AppColors.textMuted),
          const SizedBox(width: 6),
          const SkeletonBox(width: 40, height: 11, borderRadius: 3),
        ],
      ),
    );
  }
}
