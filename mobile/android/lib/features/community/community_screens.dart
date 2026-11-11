import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models.dart';
import '../../core/session.dart';
import '../../ui/widgets.dart';
import '../jobs/job_widgets.dart';

/// Projects other customers chose to share.
class GalleryScreen extends ConsumerWidget {
  const GalleryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<GalleryItem>(
      load: () => api.listOf('/gallery', GalleryItem.fromJson),
      empty: 'No shared projects yet.',
      emptyIcon: Icons.photo_library_outlined,
      itemBuilder: (context, g, _) => Card(
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (g.media.isNotEmpty)
            GestureDetector(
              onTap: () => pushPage(context, MediaViewer(media: g.media)),
              child: NetImage(g.media.first.previewUrl, height: 200, width: double.infinity),
            ),
          ListTile(
            title: Text(g.jobTitle),
            subtitle: Text([g.customerName, g.city].where((s) => s.isNotEmpty).join(' · ')),
            trailing: g.review == null ? null : StarRating(g.review!.rating, size: 16),
          ),
          if (g.media.length > 1) Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), child: MediaStrip(media: g.media)),
          if (g.review?.comment.isNotEmpty ?? false)
            Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 16), child: Text('“${g.review!.comment}”')),
        ]),
      ),
    );
  }
}

class ReviewsScreen extends ConsumerWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(apiProvider);
    return AsyncList<Review>(
      load: () => api.listOf('/reviews', Review.fromJson),
      empty: 'No reviews yet.',
      emptyIcon: Icons.star_outline,
      itemBuilder: (context, r, _) => ReviewTile(review: r),
    );
  }
}

class ReviewTile extends StatelessWidget {
  const ReviewTile({super.key, required this.review, this.trailing, this.onTap});

  final Review review;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          onTap: onTap,
          title: Row(children: [
            StarRating(review.rating, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(review.customer?.name ?? '', overflow: TextOverflow.ellipsis)),
          ]),
          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (review.comment.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(review.comment)),
            if (review.response != null && review.response!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('Response: ${review.response}', style: const TextStyle(fontStyle: FontStyle.italic)),
              ),
            Text(fmtDate(review.createdAt), style: Theme.of(context).textTheme.bodySmall),
          ]),
          trailing: trailing,
        ),
      );
}
