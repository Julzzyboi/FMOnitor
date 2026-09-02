import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// The small 5x3 amber dot grid in the top-left corner of the login page.
class DotGrid extends StatelessWidget {
  const DotGrid({super.key});

  static const int _columns = 5;
  static const int _rows = 3;
  static const double _dotSize = 6;
  static const double _gap = 10;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(_rows, (row) {
        return Padding(
          padding: EdgeInsets.only(bottom: row == _rows - 1 ? 0 : _gap),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(_columns, (col) {
              return Padding(
                padding: EdgeInsets.only(right: col == _columns - 1 ? 0 : _gap),
                child: Container(
                  width: _dotSize,
                  height: _dotSize,
                  decoration: const BoxDecoration(
                    color: AppColors.amber400,
                    shape: BoxShape.circle,
                  ),
                ),
              );
            }),
          ),
        );
      }),
    );
  }
}
