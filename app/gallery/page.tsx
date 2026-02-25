import ReactPaginate from "react-paginate";

export default function GalleryPage() {
  return (
    <div>
      <ul>
        <li>
          <div className="flex items-center justify-between h-8 bg-red-200">
            <div className="flex-1 text-center">正面</div>
            <div className="flex-1 text-center">反面</div>
            <div className="flex-1 text-center">导入时间</div>
          </div>

          <div className="flex items-center justify-between h-8">
            <div className="flex-1 text-center">你好</div>
            <div className="flex-1 text-center">Hello</div>
            <div className="flex-1 text-center">2026-01-01</div>
          </div>
        </li>
      </ul>

      <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        // onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={10}
        previousLabel="< previous"
        renderOnZeroPageCount={null}
      />
    </div>
  );
}
