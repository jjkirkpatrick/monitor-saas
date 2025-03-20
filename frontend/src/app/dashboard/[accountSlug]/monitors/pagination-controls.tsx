"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
  accountSlug: string;
  searchParams?: {
    search?: string;
    status?: string;
    tag?: string;
    sort?: string;
  };
}

export default function PaginationControls({
  totalPages,
  currentPage,
  accountSlug,
}: PaginationControlsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentSearchParams = useSearchParams();
  
  // Create URL with updated page parameter
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    
    // Add page parameter
    params.set("page", page.toString());
    
    return `${pathname}?${params.toString()}`;
  };
  
  // Handle page navigation
  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page));
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    console.log("totalPages", totalPages);
    // For small number of pages, show all pages
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push("ellipsis1");
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push("ellipsis2");
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous page button */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious 
              href={createPageUrl(currentPage - 1)} 
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            />
          </PaginationItem>
        )}
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis1" || page === "ellipsis2") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={`page-${page}`}>
              <PaginationLink 
                href={createPageUrl(page as number)} 
                isActive={currentPage === page}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(page as number);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        {/* Next page button */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext 
              href={createPageUrl(currentPage + 1)} 
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
