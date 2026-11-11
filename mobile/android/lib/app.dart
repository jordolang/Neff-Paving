import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/company_config.dart';
import 'core/session.dart';
import 'features/auth/auth_screens.dart';
import 'ui/shell.dart';
import 'ui/theme.dart';

/// Shared entrypoint for every flavor.
void bootstrap(CompanyConfig config) {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(ProviderScope(
    overrides: [companyConfigProvider.overrideWithValue(config)],
    child: const ServiceApp(),
  ));
}

/// Bridges session changes into go_router redirects.
class _SessionListenable extends ChangeNotifier {
  _SessionListenable(Ref ref) {
    ref.listen(sessionProvider, (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final listenable = _SessionListenable(ref);
  ref.onDispose(listenable.dispose);
  const authPaths = {'/login', '/signup', '/forgot'};
  return GoRouter(
    initialLocation: '/home/profile',
    refreshListenable: listenable,
    redirect: (context, state) {
      final session = ref.read(sessionProvider);
      final path = state.matchedLocation;
      if (session.isLoading || session.hasError) return path == '/splash' ? null : '/splash';
      final signedIn = session.value != null;
      if (!signedIn) return authPaths.contains(path) ? null : '/login';
      // Signed in: straight to Profile from any auth/splash screen.
      if (authPaths.contains(path) || path == '/splash') return '/home/profile';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignUpScreen()),
      GoRoute(path: '/forgot', builder: (_, _) => const ForgotPasswordScreen()),
      GoRoute(path: '/home', redirect: (_, _) => '/home/profile'),
      GoRoute(
        path: '/home/:feature',
        builder: (_, state) => HomeShell(featureKey: state.pathParameters['feature'] ?? 'profile'),
      ),
    ],
  );
});

class ServiceApp extends ConsumerWidget {
  const ServiceApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(companyConfigProvider);
    return MaterialApp.router(
      title: cfg.name,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(cfg, Brightness.light),
      darkTheme: buildTheme(cfg, Brightness.dark),
      // Neff's brand is amber on near-black; default the field app to dark.
      themeMode: cfg.key == 'neff' ? ThemeMode.dark : ThemeMode.system,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
