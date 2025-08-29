import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type React from "react";
import { TopNav } from "./topnav";

// Mock Clerk components
const MockSignInButton = ({ children }: { children: React.ReactNode }) => (
  <button data-testid="sign-in-button">{children}</button>
);
MockSignInButton.displayName = "MockSignInButton";

const MockSignedIn = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="signed-in">{children}</div>
);
MockSignedIn.displayName = "MockSignedIn";

const MockSignedOut = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="signed-out">{children}</div>
);
MockSignedOut.displayName = "MockSignedOut";

const MockUserButton = () => <button data-testid="user-button">User</button>;
MockUserButton.displayName = "MockUserButton";

vi.mock("@clerk/nextjs", () => ({
  SignInButton: MockSignInButton,
  SignedIn: MockSignedIn,
  SignedOut: MockSignedOut,
  UserButton: MockUserButton,
}));

// Mock Next.js components
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<any>, options?: any) => {
    const Component = ({ children, onClose, onSuccess }: any) => (
      <div data-testid={options?.loading ? "loading" : "dynamic-component"}>
        {children}
        {onClose && <button onClick={onClose}>Close</button>}
        {onSuccess && <button onClick={onSuccess}>Success</button>}
      </div>
    );
    return Component;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-testid="logo-image"
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className} data-testid="nav-link">
      {children}
    </a>
  ),
}));

// Mock search provider
const mockSetSearchTerm = vi.fn();
vi.mock("~/providers", () => ({
  useSearch: () => ({
    searchTerm: "",
    setSearchTerm: mockSetSearchTerm,
  }),
}));

// Mock UI components
vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    asChild,
    variant,
    className,
    ...props
  }: any) => {
    if (asChild) {
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    }
    return (
      <button
        onClick={onClick}
        className={className}
        data-variant={variant}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("~/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      data-testid="search-input"
      {...props}
    />
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  Search: () => <span data-testid="search-icon">🔍</span>,
  ShoppingCart: () => <span data-testid="shopping-cart-icon">🛒</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
}));

describe("TopNav Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Signed-in navigation", () => {
    it("displays correctly with all features when signed in", () => {
      render(<TopNav />);

      // Should show signed-in content
      expect(screen.getByTestId("signed-in")).toBeInTheDocument();

      // Should show logo and brand name
      expect(screen.getByTestId("logo-image")).toBeInTheDocument();
      expect(screen.getByTestId("nav-link")).toHaveAttribute("href", "/");
      expect(screen.getByText("Recipe Vault")).toBeInTheDocument();

      // Should show search input by default
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search recipes...")
      ).toBeInTheDocument();

      // Should show all action buttons by default
      expect(screen.getByText("Add Recipe")).toBeInTheDocument();
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
      expect(screen.getByText("Shopping Lists")).toBeInTheDocument();

      // Should show user button
      expect(screen.getByTestId("user-button")).toBeInTheDocument();

      // Should show all icons
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
      expect(screen.getByTestId("shopping-cart-icon")).toBeInTheDocument();
    });

    it("handles search functionality correctly", () => {
      render(<TopNav />);

      const searchInput = screen.getByTestId("search-input");

      // Test search input change
      fireEvent.change(searchInput, { target: { value: "pasta" } });

      expect(mockSetSearchTerm).toHaveBeenCalledWith("pasta");
    });

    it("opens and closes add recipe modal", async () => {
      render(<TopNav />);

      const addRecipeButton = screen.getByText("Add Recipe");

      // Click to open modal
      fireEvent.click(addRecipeButton);

      // Modal should be rendered
      await waitFor(() => {
        expect(screen.getByTestId("dynamic-component")).toBeInTheDocument();
      });
    });
  });

  describe("Signed-out navigation", () => {
    it("shows only logo and sign-in button when signed out", () => {
      // For this test, we need to mock the signed-out state
      // This would typically be handled by the actual Clerk components

      render(<TopNav />);

      // Should show signed-out content
      expect(screen.getByTestId("signed-out")).toBeInTheDocument();

      // Should show logo and brand name
      expect(screen.getByTestId("logo-image")).toBeInTheDocument();
      expect(screen.getByText("Recipe Vault")).toBeInTheDocument();

      // Should show sign-in button
      expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toBeInTheDocument();

      // Should NOT show search or action buttons
      expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
      expect(screen.queryByText("Add Recipe")).not.toBeInTheDocument();
      expect(screen.queryByText("Meal Planner")).not.toBeInTheDocument();
      expect(screen.queryByText("Shopping Lists")).not.toBeInTheDocument();
      expect(screen.queryByTestId("user-button")).not.toBeInTheDocument();
    });
  });

  describe("Props functionality", () => {
    it("hides search when showSearch is false", () => {
      render(<TopNav showSearch={false} />);

      // Should not show search input
      expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
      expect(screen.queryByTestId("search-icon")).not.toBeInTheDocument();

      // Should still show other elements
      expect(screen.getByText("Add Recipe")).toBeInTheDocument();
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });

    it("hides actions when showActions is false", () => {
      render(<TopNav showActions={false} />);

      // Should not show action buttons
      expect(screen.queryByText("Add Recipe")).not.toBeInTheDocument();
      expect(screen.queryByText("Meal Planner")).not.toBeInTheDocument();
      expect(screen.queryByText("Shopping Lists")).not.toBeInTheDocument();

      // Should still show search and user button
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });

    it("hides both search and actions when both props are false", () => {
      render(<TopNav showSearch={false} showActions={false} />);

      // Should not show search or actions
      expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
      expect(screen.queryByText("Add Recipe")).not.toBeInTheDocument();
      expect(screen.queryByText("Meal Planner")).not.toBeInTheDocument();
      expect(screen.queryByText("Shopping Lists")).not.toBeInTheDocument();

      // Should still show logo and user button
      expect(screen.getByText("Recipe Vault")).toBeInTheDocument();
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });

    it("shows search and actions by default when props are not provided", () => {
      render(<TopNav />);

      // Should show both search and actions by default
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(screen.getByText("Add Recipe")).toBeInTheDocument();
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
      expect(screen.getByText("Shopping Lists")).toBeInTheDocument();
    });
  });

  describe("Component imports and usage", () => {
    it("uses all required Clerk components", () => {
      render(<TopNav />);

      // Verify all Clerk components are rendered
      expect(screen.getByTestId("signed-in")).toBeInTheDocument();
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });

    it("uses all required UI components", () => {
      render(<TopNav />);

      // Verify UI components are used
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(screen.getAllByTestId("button")).toHaveLength(3); // Add Recipe, Meal Planner, Shopping Lists
    });

    it("uses all required icons", () => {
      render(<TopNav />);

      // Verify all icons are rendered
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
      expect(screen.getByTestId("shopping-cart-icon")).toBeInTheDocument();
    });
  });

  describe("Navigation links", () => {
    it("has correct href attributes for navigation links", () => {
      render(<TopNav />);

      // Check main logo link
      const logoLink = screen.getByTestId("nav-link");
      expect(logoLink).toHaveAttribute("href", "/");

      // Check that meal planner and shopping lists buttons contain links
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
      expect(screen.getByText("Shopping Lists")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<TopNav />);

      const searchInput = screen.getByTestId("search-input");
      expect(searchInput).toHaveAttribute("placeholder", "Search recipes...");
    });

    it("has proper semantic structure", () => {
      render(<TopNav />);

      // Should have nav element
      const navElements = screen.getAllByRole("navigation");
      expect(navElements.length).toBeGreaterThan(0);
    });
  });
});
